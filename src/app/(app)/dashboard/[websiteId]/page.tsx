export default async function WebsitePage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;

  return (
    <div>
      <h1 className="font-semibold text-3xl">Site: {websiteId}</h1>
    </div>
  );
}
