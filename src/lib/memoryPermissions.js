export function getMemoryOwnerId(memory = {}, activity = {}) {
  return (
    memory?.created_by ||
    memory?.user_id ||
    memory?.uploaded_by ||
    activity?.actor_id ||
    activity?.user_id ||
    ""
  );
}

export function isMemoryOwner(memory, activity, currentUserId) {
  if (!currentUserId) return false;
  return getMemoryOwnerId(memory, activity) === currentUserId;
}
