import { redirect } from "next/navigation";

export default function ArtistAliasPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/artists/${params.id}`);
}