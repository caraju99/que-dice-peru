import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

const providers: any[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

providers.push(
  CredentialsProvider({
    id: 'demo',
    name: 'Cuenta de prueba',
    credentials: {
      name: { label: 'Nombre', type: 'text', placeholder: 'Tu nombre' },
      email: { label: 'Email', type: 'email', placeholder: 'tu@email.com' }
    },
    async authorize(credentials) {
      if (!credentials?.email) return null;

      let user = await prisma.user.findUnique({
        where: { email: credentials.email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: credentials.email,
            name: credentials.name || credentials.email.split('@')[0],
            diceBalance: 10000
          }
        });
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image
      };
    }
  })
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login'
  },
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // Para Google Login — busca el usuario por email
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string }
        });
        if (dbUser) {
          token.id = dbUser.id;
          // Asegura que tenga DICE Coins
          if (dbUser.diceBalance === 0) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { diceBalance: 10000 }
            });
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string }
        });
        if (dbUser) {
          (session.user as any).isAdmin = dbUser.isAdmin;
          (session.user as any).diceBalance = dbUser.diceBalance;
          session.user.name = dbUser.name;
          session.user.email = dbUser.email;
        }
      }
      return session;
    }
  }
};