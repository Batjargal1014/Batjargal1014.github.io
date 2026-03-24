(function (global) {
  function getSessionId(session) {
    const rawId = String(session && session.session_id ? session.session_id : "").trim();
    if (rawId) return rawId;

    const token = String(session && session.access_token ? session.access_token : "").trim();
    if (!token || token.split(".").length < 2) return "";

    try {
      const payloadPart = token.split(".")[1];
      const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
      const payload = JSON.parse(atob(padded));
      return String(payload && payload.session_id ? payload.session_id : "").trim();
    } catch {
      return "";
    }
  }

  async function saveCurrentSession(supabaseClient, userId, session) {
    const targetUserId = String(userId || "").trim();
    const currentSessionId = getSessionId(session);
    if (!supabaseClient || !targetUserId || !currentSessionId) return false;

    const { error } = await supabaseClient
      .from("profiles")
      .update({ current_session: currentSessionId })
      .eq("id", targetUserId);

    return !error;
  }

  async function isCurrentSessionValid(supabaseClient, userId, session) {
    const targetUserId = String(userId || "").trim();
    const currentSessionId = getSessionId(session);
    if (!supabaseClient || !targetUserId || !currentSessionId) return false;

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("current_session")
      .eq("id", targetUserId)
      .maybeSingle();

    if (error || !data) return false;
    const dbSessionId = String(data.current_session || "").trim();
    if (!dbSessionId) return true;
    return dbSessionId === currentSessionId;
  }

  global.SessionGuard = {
    getSessionId: getSessionId,
    saveCurrentSession: saveCurrentSession,
    isCurrentSessionValid: isCurrentSessionValid,
  };
})(window);
