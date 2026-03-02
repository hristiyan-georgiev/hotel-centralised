import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { NotesList } from "@/components/dashboard/notes-list"
import type { Category, HandoverNote } from "@/lib/types"

const refreshMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()

const eqMock = vi.fn()
const deleteMock = vi.fn(() => ({ eq: eqMock }))
const fromMock = vi.fn(() => ({ delete: deleteMock }))
const createClientMock = vi.fn(() => ({ from: fromMock }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => createClientMock(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}))

const categories: Category[] = [
  {
    id: "cat-ops",
    name: "Operations",
    color: "#0ea5e9",
    created_at: "2026-03-01T00:00:00.000Z",
  },
]

const notes: HandoverNote[] = [
  {
    id: "note-1",
    author_id: "user-1",
    department_id: "dep-1",
    category_id: "cat-ops",
    title: "Pipe leak in room 104",
    content: "Water pressure dropped near the linen room.",
    priority: "urgent",
    note_date: "2026-03-01",
    created_at: "2026-03-01T09:15:00.000Z",
    updated_at: "2026-03-01T09:15:00.000Z",
    author: {
      id: "user-1",
      email: "manager@hotel.com",
      full_name: "Maria Manager",
      department_id: "dep-1",
      role: "admin",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-03-01T00:00:00.000Z",
      is_active: true,
    },
    category: categories[0],
  },
  {
    id: "note-2",
    author_id: "user-2",
    department_id: "dep-1",
    category_id: "cat-ops",
    title: "Breakfast prep completed",
    content: "All buffet stations stocked for the morning shift.",
    priority: "normal",
    note_date: "2026-03-01",
    created_at: "2026-03-01T06:30:00.000Z",
    updated_at: "2026-03-01T06:30:00.000Z",
    author: {
      id: "user-2",
      email: "staff@hotel.com",
      full_name: "Nina Staff",
      department_id: "dep-1",
      role: "staff",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-03-01T00:00:00.000Z",
      is_active: true,
    },
    category: categories[0],
  },
]

function renderNotesList(userRole: string = "admin") {
  return render(
    <NotesList
      notes={notes}
      currentUserId="user-1"
      categories={categories}
      selectedDate="2026-03-01"
      userRole={userRole}
    />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("NotesList", () => {
  it("renders notes and filters by search query", async () => {
    const user = userEvent.setup()
    renderNotesList()

    expect(screen.getByText("Pipe leak in room 104")).toBeInTheDocument()
    expect(screen.getByText("Breakfast prep completed")).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText("Search handover notes..."), "pipe")

    expect(screen.getByText("Pipe leak in room 104")).toBeInTheDocument()
    expect(screen.queryByText("Breakfast prep completed")).not.toBeInTheDocument()
  })

  it("switches between urgent and mine filters", async () => {
    const user = userEvent.setup()
    renderNotesList()

    await user.click(screen.getByRole("button", { name: /urgent only/i }))
    expect(screen.getByText("Pipe leak in room 104")).toBeInTheDocument()
    expect(screen.queryByText("Breakfast prep completed")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /written by you/i }))
    expect(screen.getByText("Pipe leak in room 104")).toBeInTheDocument()
    expect(screen.queryByText("Breakfast prep completed")).not.toBeInTheDocument()
  })

  it("shows edit and delete actions only for manager/admin roles", () => {
    renderNotesList("staff")
    expect(screen.queryByLabelText(/edit note/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/delete note/i)).not.toBeInTheDocument()

    renderNotesList("admin")
    expect(screen.getByLabelText("Edit note Pipe leak in room 104")).toBeInTheDocument()
    expect(screen.getByLabelText("Delete note Pipe leak in room 104")).toBeInTheDocument()
  })

  it("deletes a note and refreshes the page on success", async () => {
    eqMock.mockResolvedValueOnce({ error: null })

    const user = userEvent.setup()
    renderNotesList()

    await user.click(screen.getByLabelText("Delete note Pipe leak in room 104"))
    await user.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith("handover_notes")
      expect(eqMock).toHaveBeenCalledWith("id", "note-1")
      expect(toastSuccessMock).toHaveBeenCalledWith("Note deleted successfully")
      expect(refreshMock).toHaveBeenCalled()
    })
  })

  it("shows an error toast if note deletion fails", async () => {
    eqMock.mockResolvedValueOnce({ error: { message: "delete failed" } })

    const user = userEvent.setup()
    renderNotesList()

    await user.click(screen.getByLabelText("Delete note Pipe leak in room 104"))
    await user.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Failed to delete note", {
        description: "delete failed",
      })
      expect(refreshMock).toHaveBeenCalled()
    })
  })

  it("opens edit note dialog", async () => {
    const user = userEvent.setup()
    renderNotesList()

    await user.click(screen.getByLabelText("Edit note Pipe leak in room 104"))

    expect(await screen.findByText("Edit Handover Note")).toBeInTheDocument()
  })
})
