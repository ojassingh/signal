export default async function WebsitePage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;

  return (
    <div>
      <h1 className="text-2xl">Site: {websiteId}</h1>
    </div>
  );
}
