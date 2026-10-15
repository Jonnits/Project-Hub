import type { Person, SessionUser } from "@/lib/types";

export function personFromUser(user: SessionUser, role = "Member"): Person {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    role,
    color: user.color,
  };
}
