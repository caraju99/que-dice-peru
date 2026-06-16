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
    async jwt({ token, user }) {
      // Primera vez que entra: guarda el id en el token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Pone el id real del usuario en la sesión
        (session.user as any).id = token.id as string;

        // Trae datos frescos de la base de datos
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