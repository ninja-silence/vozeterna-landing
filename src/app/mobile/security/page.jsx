import Link from "next/link";
import { ArrowLeft, Eye, Globe2, LockKeyhole, ShieldCheck } from "lucide-react";

export default async function MobileSecurityPage({ searchParams }) {
  const params = await searchParams;
  const memoryId = params?.memoryId || "";
  const vaultId = params?.vaultId || "";
  const backHref = memoryId ? `/mobile/memories/${memoryId}` : "/mobile/library";

  return (
    <section className="mobileScreenStack mobileSecurityScreen">
      <div className="mobileScreenHero">
        <p className="mobileCapsLabel">Security</p>
        <h1>Memory security</h1>
        <p>Review who can access this memory and how it is shared.</p>

        <Link href={backHref} className="mobilePrimaryButton">
          <ArrowLeft size={17} />
          {memoryId ? "Back to memory" : "Back to Library"}
        </Link>
      </div>

      <section className="mobileSecurityGrid">
        <article>
          <ShieldCheck size={22} />
          <strong>Private by default</strong>
          <p>Memories stay private unless you intentionally share them.</p>
        </article>

        <article>
          <Eye size={22} />
          <strong>Network feed visibility</strong>
          <p>Shared memories can appear only for members of the connected family or friend network.</p>
        </article>

        <article>
          <Globe2 size={22} />
          <strong>Public page visibility</strong>
          <p>Public memorial pages show only memories selected for public sharing.</p>
        </article>

        <article>
          <LockKeyhole size={22} />
          <strong>Vault context</strong>
          <p>{vaultId ? `Vault: ${vaultId}` : "No vault id was provided for this view."}</p>
        </article>
      </section>
    </section>
  );
}
