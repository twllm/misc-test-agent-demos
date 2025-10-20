import React from 'react'

export function makeTextArea(content: string): React.ReactElement {
  return (
    <textarea
      defaultValue={content}
      rows={8}
      style={{ width: '100%', padding: '8px' }}
    />
  )
}
