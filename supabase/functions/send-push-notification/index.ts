// Follows Supabase Edge Functions structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";

interface NotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  priority?: "default" | "normal" | "high";
  badge?: number;
  channelId?: string;
}

serve(async (req) => {
  try {
    const { record } = await req.json();
    
    // Only process if we have a record
    if (!record) {
      return new Response(JSON.stringify({ message: "No record provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Check user settings
    const { data: settings } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", record.user_id)
      .single();

    if (settings && !settings.push_enabled) {
      return new Response(JSON.stringify({ message: "Push notifications disabled for user" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check quiet hours
    if (settings?.quiet_hours_enabled) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const start = settings.quiet_hours_start;
      const end = settings.quiet_hours_end;
      
      // Simple check for quiet hours (handle crossing midnight later if needed)
      if (currentTime >= start || currentTime <= end) {
         // Optionally queue it, but for now just skip push
         return new Response(JSON.stringify({ message: "Quiet hours active" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 3. Get User's Push Tokens
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", record.user_id)
      .eq("is_active", true);

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No active push tokens found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Construct Push Payload
    const messages: NotificationPayload[] = tokens.map((t) => ({
      to: t.token,
      title: record.title,
      body: record.message,
      data: {
        notificationId: record.id,
        type: record.type,
        ...record.metadata,
      },
      sound: "default",
      priority: record.priority === 'urgent' || record.priority === 'high' ? 'high' : 'normal',
    }));

    // 5. Send to Expo
    // Chunking is recommended for large batches, but here we process per-user
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    // 6. Handle Invalid Tokens (Cleanup)
    if (result.data) {
      const invalidTokens: string[] = [];
      result.data.forEach((ticket: any, index: number) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          invalidTokens.push(messages[index].to as string);
        }
      });

      if (invalidTokens.length > 0) {
        await supabase
          .from("push_tokens")
          .update({ is_active: false })
          .in("token", invalidTokens);
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
