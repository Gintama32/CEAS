import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemInput from '../ItemInput'

function setup() {
  const onDataSubmit = vi.fn()
  render(<ItemInput onDataSubmit={onDataSubmit} />)
  return { onDataSubmit }
}

test('Save button disabled until at least one item is added', async () => {
  setup()
  const saveBtn = screen.getByRole('button', { name: /save data to database/i })
  expect(saveBtn).toBeDisabled()

  // Fill minimal item fields and click Add Item
  await userEvent.type(screen.getByLabelText(/description/i), 'Concrete')
  await userEvent.clear(screen.getByLabelText(/quantity/i))
  await userEvent.type(screen.getByLabelText(/quantity/i), '10')
  await userEvent.click(screen.getByRole('button', { name: /add item/i }))

  expect(saveBtn).not.toBeDisabled()
})

test('Add and remove item updates the list', async () => {
  setup()
  await userEvent.type(screen.getByLabelText(/description/i), 'Steel Beam')
  await userEvent.clear(screen.getByLabelText(/quantity/i))
  await userEvent.type(screen.getByLabelText(/quantity/i), '5')
  await userEvent.click(screen.getByRole('button', { name: /add item/i }))

  // Item appears in the table
  expect(screen.getByText('Steel Beam')).toBeInTheDocument()

  // Remove the item
  await userEvent.click(screen.getByRole('button', { name: /remove/i }))

  expect(screen.queryByText('Steel Beam')).not.toBeInTheDocument()
})

test('Submitting calls onDataSubmit with items array', async () => {
  const { onDataSubmit } = setup()
  await userEvent.type(screen.getByLabelText(/description/i), 'Labor')
  await userEvent.clear(screen.getByLabelText(/quantity/i))
  await userEvent.type(screen.getByLabelText(/quantity/i), '2')
  await userEvent.click(screen.getByRole('button', { name: /add item/i }))

  await userEvent.click(screen.getByRole('button', { name: /save data to database/i }))

  expect(onDataSubmit).toHaveBeenCalledTimes(1)
  const payload = onDataSubmit.mock.calls[0][0]
  expect(Array.isArray(payload.items)).toBe(true)
  expect(payload.items.length).toBe(1)
  expect(payload.items[0]).toMatchObject({ description: 'Labor', quantity: 2 })
})
