"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateComplaintDialog } from "./create-complaint-dialog"
import type { Profile, Department, ComplaintTag } from "@/lib/types"

interface CreateComplaintButtonProps {
  profile: Profile
  staffMembers: Profile[]
  departments: Department[]
  availableTags: ComplaintTag[]
}

export function CreateComplaintButton({ profile, staffMembers, departments, availableTags }: CreateComplaintButtonProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button className="cursor-pointer" onClick={() => setCreateOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Complaint
      </Button>

      <CreateComplaintDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        profile={profile}
        staffMembers={staffMembers}
        departments={departments}
        availableTags={availableTags}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
