import { NextApiHandler } from "next";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { StacksMessage } from "../../../utils/stacksMessage";

const auth: NextApiHandler = async (req, res) => {
  const providers = [
    CredentialsProvider({
      name: "Stacks",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials) {
        console.log({ credentials });
        try {
          const siwe = new StacksMessage(credentials?.message || "");
          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL!);
          if (siwe.domain !== nextAuthUrl.host) {
            return null;
          }
          if (siwe.nonce !== (await getCsrfToken({ req }))) {
            return null;
          }

          await siwe.verify({ signature: credentials?.signature || "" });
        
          return {
            id: siwe.address,
          };
        } catch (e) {
          console.log(e);
          return null;
        }
      },
    }),
  ];

  const isDefaultSigninPage =
    req.method === "GET" && req.query.nextauth.includes("signin");

  if (isDefaultSigninPage) {
    providers.pop();
  }

  return await NextAuth(req, res, {
    providers,
    session: {
      strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      async session({ session, token }) {
        session.address = token.sub;
        return session;
      },
    },
  });
};

export default auth;
