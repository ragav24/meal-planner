async function request(path, options = {}) {
  const response = await fetch(`/api/items${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (response.status === 204) return null

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(body?.message || `Request failed with status ${response.status}`)
    error.status = response.status
    error.body = body
    throw error
  }

  return body
}

export function fetchItems() {
  return request('')
}

export function createItem(name) {
  return request('', { method: 'POST', body: JSON.stringify({ name }) })
}

export function renameItem(id, name) {
  return request(`/${id}`, { method: 'PUT', body: JSON.stringify({ name }) })
}

export function deleteItem(id) {
  return request(`/${id}`, { method: 'DELETE' })
}
