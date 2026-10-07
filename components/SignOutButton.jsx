"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      className="ghost-button"
      onClick={() => signOut({ callbackUrl: "/signin" })}
    >
      Sign out
    </button>
  );
}
