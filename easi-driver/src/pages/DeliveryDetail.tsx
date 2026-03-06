import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  ExternalLink,
  Check,
  Camera,
  Handshake,
  Package,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/StatusBadge';
import type {
  DeliveryAssignment,
  DeliveryStatus,
  DigitalHandshake,
  StaffProfile,
} from '../types';
import { STATUS_ORDER, STATUS_LABELS } from '../types';

interface DeliveryDetailProps {
  driver: StaffProfile;
}

const ACTION_BUTTON: Partial<
  Record<DeliveryStatus, { label: string; next: DeliveryStatus }>
> = {
  assigned: { label: 'Start Delivery', next: 'dispatched' },
  dispatched: { label: "I'm En Route", next: 'en_route' },
  en_route: { label: "I've Arrived", next: 'arrived' },
  arrived: { label: 'Complete Delivery', next: 'delivered' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(amount);
}

function parseAddress(raw: string | null | undefined): string {
  if (!raw) return 'No address';
  try {
    const parsed = JSON.parse(raw);
    return parsed.address || raw;
  } catch {
    return raw;
  }
}

function parseContactPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.phone || null;
  } catch {
    return null;
  }
}

function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function DeliveryDetail({ driver: _driver }: DeliveryDetailProps) {
  void _driver;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null);
  const [handshake, setHandshake] = useState<DigitalHandshake | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proof of delivery modal state
  const [proofModal, setProofModal] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [proofPhotoPreview, setProofPhotoPreview] = useState<string | null>(
    null
  );
  const [proofNotes, setProofNotes] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);

  // Handshake state
  const [confirmingHandshake, setConfirmingHandshake] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssignment = useCallback(async () => {
    if (!id) return;
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('delivery_assignments')
        .select(
          `
          *,
          order:orders (
            *,
            company:companies ( name ),
            order_items ( * )
          )
        `
        )
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setAssignment(data as DeliveryAssignment);

      if (data?.status === 'delivered' && data?.order_id) {
        const { data: hs } = await supabase
          .from('digital_handshakes')
          .select('*')
          .eq('order_id', data.order_id)
          .maybeSingle();
        setHandshake(hs as DigitalHandshake | null);
      }

      // Pre-fill recipient from company contact
      if (data?.order?.company?.name) {
        setRecipientName(data.order.company.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load delivery');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  async function advanceStatus() {
    if (!assignment) return;
    const action = ACTION_BUTTON[assignment.status as DeliveryStatus];
    if (!action) return;

    if (action.next === 'delivered') {
      setProofModal(true);
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const updates: Record<string, unknown> = { status: action.next };
      if (action.next === 'dispatched')
        updates.dispatched_at = new Date().toISOString();
      if (action.next === 'arrived')
        updates.arrived_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('delivery_assignments')
        .update(updates)
        .eq('id', assignment.id);

      if (updateError) throw updateError;
      await fetchAssignment();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submitProofOfDelivery() {
    if (!assignment || !recipientName.trim()) return;
    setSubmittingProof(true);
    setError(null);

    try {
      let photoUrl: string | null = null;

      if (proofPhoto) {
        const fileName = `${assignment.id}_${Date.now()}.${proofPhoto.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('delivery-proofs')
          .upload(fileName, proofPhoto);

        if (uploadError) {
          console.warn(
            'Photo upload failed, continuing without photo:',
            uploadError.message
          );
        } else {
          const { data: urlData } = supabase.storage
            .from('delivery-proofs')
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      // Insert proof of delivery
      const { error: proofError } = await supabase
        .from('delivery_proofs')
        .insert({
          delivery_assignment_id: assignment.id,
          recipient_name: recipientName.trim(),
          photo_url: photoUrl,
          notes: proofNotes.trim() || null,
        });

      if (proofError) throw proofError;

      // Update assignment to delivered
      const now = new Date().toISOString();
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({ status: 'delivered', delivered_at: now })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      // Update the order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'delivered', updated_at: now })
        .eq('id', assignment.order_id);

      if (orderError)
        console.warn('Failed to update order status:', orderError.message);

      // Create digital handshake record
      const { error: hsError } = await supabase
        .from('digital_handshakes')
        .insert({
          order_id: assignment.order_id,
          driver_confirmed: true,
          driver_confirmed_at: now,
        });

      if (hsError) console.warn('Failed to create handshake:', hsError.message);

      setProofModal(false);
      await fetchAssignment();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to complete delivery'
      );
    } finally {
      setSubmittingProof(false);
    }
  }

  async function confirmHandshake() {
    if (!assignment || !handshake) return;
    setConfirmingHandshake(true);

    try {
      const now = new Date().toISOString();
      const updates: Record<string, unknown> = {
        driver_confirmed: true,
        driver_confirmed_at: now,
      };

      if (handshake.customer_confirmed) {
        updates.completed = true;
        updates.completed_at = now;
      }

      const { error: hsError } = await supabase
        .from('digital_handshakes')
        .update(updates)
        .eq('id', handshake.id);

      if (hsError) throw hsError;
      await fetchAssignment();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to confirm handshake'
      );
    } finally {
      setConfirmingHandshake(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment?.order) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-gray-500">Delivery not found</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const order = assignment.order;
  const status = assignment.status as DeliveryStatus;
  const action = ACTION_BUTTON[status];
  const isDelivered = status === 'delivered';
  const currentStepIndex = STATUS_ORDER.indexOf(status);
  const displayAddress = parseAddress(order.delivery_address);
  const contactPhone = parseContactPhone(order.delivery_address);
  const totalAmount =
    typeof order.total === 'number' && !isNaN(order.total) ? order.total : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Back header */}
        <div className="sticky top-0 bg-gray-100 z-10 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 active:text-black transition-colors min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
        </div>

        <div className="px-4 space-y-4">
          {/* Order info card */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-gray-900">
                {order.order_number}
              </h1>
              <StatusBadge status={status} />
            </div>

            <div className="space-y-2">
              <p className="font-medium text-gray-900">
                {order.company?.name || 'Customer'}
              </p>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{displayAddress}</p>
                  <a
                    href={mapsUrl(displayAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 mt-1 min-h-[44px]"
                  >
                    Open in Maps
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-2 text-sm text-gray-700 min-h-[44px]"
                >
                  <Phone className="h-4 w-4 text-gray-400" />
                  {contactPhone}
                </a>
              )}
            </div>
          </div>

          {/* Items card */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Items
            </h2>
            <div className="space-y-2">
              {order.order_items?.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">
                      {item.product_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-sm text-gray-500">
                      ×{item.quantity}
                    </span>
                    <span className="text-sm font-medium text-gray-900 w-20 text-right">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-base font-bold text-gray-900">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Status pipeline card */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Delivery Progress
            </h2>
            <div className="flex items-center justify-between">
              {STATUS_ORDER.map((step, i) => {
                const isCompleted = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const isLast = i === STATUS_ORDER.length - 1;

                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                              ? 'bg-black text-white'
                              : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 text-center leading-tight ${
                          isCurrent
                            ? 'text-black font-semibold'
                            : 'text-gray-500'
                        }`}
                      >
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={`flex-1 h-0.5 mx-1 ${
                          i < currentStepIndex
                            ? 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {order.order_notes && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                Notes
              </h2>
              <p className="text-sm text-gray-600">{order.order_notes}</p>
            </div>
          )}

          {/* Digital Handshake section (shown after delivery) */}
          {isDelivered && handshake && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Handshake className="h-4 w-4" />
                Digital Handshake
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Driver confirmed
                  </span>
                  {handshake.driver_confirmed ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                      <Check className="h-4 w-4" />
                      Confirmed
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Pending</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Customer confirmed
                  </span>
                  {handshake.customer_confirmed ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                      <Check className="h-4 w-4" />
                      Confirmed
                    </span>
                  ) : (
                    <span className="text-sm text-amber-600 font-medium">
                      Waiting for customer
                    </span>
                  )}
                </div>

                {handshake.completed && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-center">
                    <p className="text-sm font-semibold text-emerald-700">
                      Delivery fully confirmed
                    </p>
                  </div>
                )}

                {!handshake.driver_confirmed && (
                  <Button
                    fullWidth
                    size="lg"
                    loading={confirmingHandshake}
                    onClick={confirmHandshake}
                    className="mt-2"
                  >
                    <Handshake className="h-5 w-5 mr-2" />
                    Confirm Handshake
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom action button */}
      {action && !isDelivered && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            fullWidth
            size="lg"
            loading={updating}
            onClick={advanceStatus}
          >
            {action.label}
          </Button>
        </div>
      )}

      {/* Proof of Delivery Modal */}
      <Modal
        open={proofModal}
        onClose={() => !submittingProof && setProofModal(false)}
        title="Proof of Delivery"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Recipient Name *
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Name of person receiving delivery"
              className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Photo Proof
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {proofPhotoPreview ? (
              <div className="relative">
                <img
                  src={proofPhotoPreview}
                  alt="Proof"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setProofPhoto(null);
                    setProofPhotoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <Camera className="h-8 w-8" />
                <span className="text-sm font-medium">
                  Take or upload photo
                </span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={proofNotes}
              onChange={e => setProofNotes(e.target.value)}
              placeholder="Any additional notes…"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400 resize-none"
            />
          </div>

          <Button
            fullWidth
            size="lg"
            loading={submittingProof}
            disabled={!recipientName.trim()}
            onClick={submitProofOfDelivery}
          >
            <Check className="h-5 w-5 mr-2" />
            Confirm Delivery
          </Button>
        </div>
      </Modal>
    </div>
  );
}
