import Modal from './Modal'

export default function ConfirmDialog({ open, title = 'Are you sure?', message, onConfirm, onCancel, danger = true }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      <div className="flex gap-2">
        <button className="btn-outline flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button className={`${danger ? 'btn-danger' : 'btn-primary'} flex-1`} onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </Modal>
  )
}
