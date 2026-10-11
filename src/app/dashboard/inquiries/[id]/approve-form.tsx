"use client";

import { useActionState, useState } from "react";
import { approveAndSend } from "../../actions";

export function ApproveForm({ id, email, draft }: { id: string; email: string; draft: string }) {
  const [error, action, pending] = useActionState(approveAndSend, null);
  const [reply, setReply] = useState(draft);
  const edited = reply !== draft;

  return (
    <form action={action} className="flex h-full flex-col">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-medium">Draft reply</h2>
        {edited && <span className="text-xs font-semibold text-slate/60">Edited</span>}
      </div>
      <p className="mt-1 text-sm text-slate/70">To: {email}</p>
      <label htmlFor="reply" className="sr-only">Reply</label>
      <textarea
        id="reply"
        name="reply"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={10}
        className="mt-4 w-full flex-1 rounded-xl border border-pine/25 p-4 leading-relaxed focus:border-pine focus:outline-none focus:ring-4 focus:ring-sunrise/20"
      />
      <p className="mt-2 text-xs text-slate/60">{reply.length} characters</p>
      {error && <p role="alert" className="mt-3 rounded-lg bg-sunrise/15 px-4 py-3 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-sunrise px-6 py-3.5 font-semibold text-white hover:bg-[#d06a4d] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Approve and send"}
      </button>
    </form>
  );
}
