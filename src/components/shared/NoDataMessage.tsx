
import React from 'react'
import { AlertCircle } from 'lucide-react'

interface NoDataMessageProps {
  message: string
  description?: string
}

const NoDataMessage: React.FC<NoDataMessageProps> = ({ message, description }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg">
      <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700">{message}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      )}
    </div>
  )
}

export default NoDataMessage
