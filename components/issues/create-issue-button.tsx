"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateIssueDialog } from "./create-issue-dialog"
import type { Profile } from "@/lib/types"

interface CreateIssueButtonProps {
  profile: Profile
}

export function CreateIssueButton({ profile }: CreateIssueButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button className="cursor-pointer" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Issue
      </Button>
      <CreateIssueDialog
        open={open}
        onOpenChange={setOpen}
        profile={profile}
      />
    </>
  )
}
