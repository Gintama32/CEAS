import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import ProjectEstimateView from '../ProjectEstimateView'

const baseProject = {
  id: 1,
  project_name: 'Downtown Tower',
  project_location: 'Austin, TX',
  client_name: 'ACME Corp',
}

const mockRowsResponse = (rows = []) => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => rows,
  })
}

beforeEach(() => {
  fetch.mockReset()
})

test('opens modal when adding a new description item', async () => {
  mockRowsResponse([
    {
      id: 1,
      project_id: 1,
      excel_data_id: 15,
      description: 'Existing item',
      section: 'Division 1 — General',
      subsection: 'General Notes',
    },
  ])

  render(<ProjectEstimateView project={baseProject} excelDataId={15} />)

  const addButton = await screen.findByRole('button', { name: /Add New Description Item/i })
  expect(addButton).not.toBeDisabled()

  await userEvent.click(addButton)

  expect(await screen.findByRole('heading', { name: /Add New Description Item/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/Section/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Labor Amount/i)).toBeInTheDocument()
})

test('disables add button and shows guidance without estimate context', async () => {
  mockRowsResponse([])
  render(<ProjectEstimateView project={baseProject} />)

  const addButton = await screen.findByRole('button', { name: /Add New Description Item/i })
  expect(addButton).toBeDisabled()
  await screen.findByText(/Append descriptions is available/i)
})

