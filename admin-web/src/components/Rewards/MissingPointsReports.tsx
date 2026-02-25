import { FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface MissingPointsReport {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  created_at: string;
  metadata: {
    order_id: string;
    order_date: string;
    expected_points: number;
    reason: string;
    report_status: 'reported' | 'investigating' | 'resolved' | 'rejected';
  };
}

interface Props {
  reports: MissingPointsReport[];
  isLoading: boolean;
  onResolve: (report: MissingPointsReport, approved: boolean) => void;
}

export const MissingPointsReports = ({
  reports,
  isLoading,
  onResolve,
}: Props) => {
  if (isLoading)
    return <div className="text-center py-12">Loading reports...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">
        Missing Points Reports
      </h2>

      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-brand-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-primary)] font-bold">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Order / Reason</th>
              <th className="px-6 py-4">Expected</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {reports.map(report => (
              <tr key={report.id} className="hover:bg-[var(--bg-tertiary)]">
                <td className="px-6 py-4">
                  {new Date(report.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-[var(--text-primary)]">
                      {report.user_name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {report.user_email || report.user_id}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 font-mono text-xs text-[var(--text-secondary)]">
                      <FileText size={10} /> {report.metadata.order_id}
                    </span>
                    <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                      {report.metadata.reason}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-[var(--color-primary-text)]">
                  {report.metadata.expected_points} pts
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      report.metadata.report_status === 'resolved'
                        ? 'success'
                        : report.metadata.report_status === 'rejected'
                          ? 'error'
                          : 'default'
                    }
                  >
                    {report.metadata.report_status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  {report.metadata.report_status === 'reported' && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResolve(report, false)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onResolve(report, true)}
                        className="bg-[var(--text-primary)] hover:opacity-90 text-[var(--color-primary-text)] border-none"
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-[var(--text-secondary)]"
                >
                  No pending reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
