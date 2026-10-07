import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import FootballManagerDashboard from "../../components/FootballManagerDashboard";
import { authOptions } from "../../lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <FootballManagerDashboard
      managerName={session.user?.name || "Coach Smith"}
    />
  );
}
