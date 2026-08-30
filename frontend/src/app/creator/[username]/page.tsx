"use client";

import { useParams } from "next/navigation";
import { CreatorProfileView } from "@/components/creator-profile";

export default function CreatorPublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  return (
    <CreatorProfileView
      creatorId={username}
      viewMode="public"
      showNavbar={true}
    />
  );
}