import "next-auth";

declare module "next-auth" {
  interface User {
    role?: "MEMBER" | "STAFF" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role: "MEMBER" | "STAFF" | "ADMIN";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "MEMBER" | "STAFF" | "ADMIN";
  }
}
