import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import DataPage from '../DataPage'

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/projects/1/add-item']}>
      <Routes>
        <Route path="/projects/:projectId/add-item" element={<DataPage />} />
      </Routes>
    </MemoryRouter>
  )

const mockInitialFetches = () => {
  const project = {
    id: 1,
    project_name: 'Test Project',
    project_location: 'Austin',
  }
  const uploads = [
    {
      id: 10,
      project_id: 1,
      original_filename: 'Upload.xlsx',
      created_at: new Date().toISOString(),
      row_count: 10,
      status: 'processed',
    },
  ]

  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => project,
  })
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => uploads,
  })
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ id: 999 }),
  })
}

beforeEach(() => {
  fetch.mockReset()
  alert.mockClear()
})

test('DataPage submits one POST per item and shows success', async () => {
  mockInitialFetches()
  renderWithRouter()

  await screen.findByRole('button', { name: /add item/i })

  // Fill an item
  await userEvent.type(screen.getByLabelText(/description/i), 'Rebar')
  await userEvent.clear(screen.getByLabelText(/quantity/i))
  await userEvent.type(screen.getByLabelText(/quantity/i), '3')
  await userEvent.click(screen.getByRole('button', { name: /add item/i }))

  // Fill another item
  await userEvent.type(screen.getByLabelText(/description/i), 'Concrete Mix')
  await userEvent.clear(screen.getByLabelText(/quantity/i))
  await userEvent.type(screen.getByLabelText(/quantity/i), '8')
  await userEvent.click(screen.getByRole('button', { name: /add item/i }))

  // Submit
  await userEvent.click(screen.getByRole('button', { name: /save data to database/i }))

  // Two POSTs + 2 initial fetches
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))
  expect(alert).toHaveBeenCalledWith(expect.stringMatching(/Successfully saved 2 item/))
})
