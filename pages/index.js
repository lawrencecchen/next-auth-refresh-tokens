import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/client";

export default function Home() {
  const [session, loading] = useSession();

  return (
    <div>
      <Head>
        <title>Next-auth Refresh Tokens</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {!session && (
        <>
          Not signed in <br />
          <button onClick={signIn}>Sign in</button>
        </>
      )}
      {session && (
        <>
          Signed in as {session.user.email} <br />
          <button onClick={signOut}>Sign out</button>
        </>
      )}

      {session && <pre>{JSON.stringify(session, null, 2)}</pre>}
    </div>
  );
}
