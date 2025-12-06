import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectInput from '../ProjectInput'

function setup() {
  const onProjectSubmit = vi.fn()
  render(<ProjectInput onProjectSubmit={onProjectSubmit} />)
  return { onProjectSubmit }
}

test('Does not submit when required fields missing', async () => {
  const { onProjectSubmit } = setup()
  await userEvent.click(screen.getByRole('button', { name: /submit/i }))
  expect(onProjectSubmit).not.toHaveBeenCalled()
})

test('Submits flat payload when required fields present', async () => {
  const { onProjectSubmit } = setup()
  await userEvent.type(screen.getByLabelText(/project name/i), 'Bridge Build')
  await userEvent.type(screen.getByLabelText(/client name/i), 'City Council')
  await userEvent.type(screen.getByLabelText(/project location/i), 'Downtown')
  await userEvent.type(screen.getByLabelText(/prepared by/i), 'Alex')

  await userEvent.click(screen.getByRole('button', { name: /submit/i }))

  expect(onProjectSubmit).toHaveBeenCalledTimes(1)
  const payload = onProjectSubmit.mock.calls[0][0]
  expect(payload).toMatchObject({
    project_name: 'Bridge Build',
    client_name: 'City Council',
    project_location: 'Downtown',
    prepared_by: 'Alex'
  })
})
