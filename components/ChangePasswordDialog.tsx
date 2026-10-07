"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "@/app/dashboard/actions";
import { PASSWORD_MIN } from "@/lib/program";
import { Modal } from "./Modal";

const inputClass =
  "w-full rounded-2xl border-2 border-accent2 bg-white px-4 py-2.5 text-base text-ink focus:border-primary focus:outline-none";
const labelClass = "mb-1 block font-display text-sm font-medium text-teal";

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(changePassword, undefined);

  return (
    <Modal title="Change password" onClose={onClose}>
      {state?.success ? (
        <div className="space-y-4 py-2">
          <p className="rounded-2xl bg-[#DBF4E2] px-4 py-3 text-sm text-[#22693B]" role="status">
            Password changed. Share the new password with your staff. Anyone already logged in stays logged in.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-primary px-4 py-2.5 font-display font-medium text-white shadow-[0_4px_0_#6FA3CC]"
          >
            Done
          </button>
        </div>
      ) : (
        <form action={action} className="space-y-3">
          <div>
            <label htmlFor="currentPassword" className={labelClass}>
              Current password
            </label>
            <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="newPassword" className={labelClass}>
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN}
              placeholder={`At least ${PASSWORD_MIN} characters`}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className={labelClass}>
              Confirm new password
            </label>
            <input
              id="confirmNewPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN}
              className={inputClass}
            />
          </div>

          {state?.error && (
            <p className="rounded-2xl bg-[#FFE3EA] px-4 py-3 text-sm text-[#9E2F55]" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border-2 border-accent2 px-4 py-2.5 font-display font-medium text-teal hover:bg-sky"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-2xl bg-primary px-4 py-2.5 font-display font-medium text-white shadow-[0_4px_0_#6FA3CC] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Change password"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
