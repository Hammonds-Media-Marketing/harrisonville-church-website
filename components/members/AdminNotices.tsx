/** Status strip for admin screens — reads ?saved / ?deleted / ?error params. */
export function AdminNotices({ params }: { params: { saved?: string; deleted?: string; error?: string } }) {
  if (params.saved) {
    return (
      <p role="status" className="mb-5 font-semibold text-primary-strong">
        Saved.
      </p>
    )
  }
  if (params.deleted) {
    return (
      <p role="status" className="mb-5 font-semibold text-primary-strong">
        Deleted.
      </p>
    )
  }
  if (params.error === 'self') {
    return (
      <p role="alert" className="mb-5 font-semibold text-error">
        You cannot remove or demote your own admin account.
      </p>
    )
  }
  if (params.error) {
    return (
      <p role="alert" className="mb-5 font-semibold text-error">
        That change did not save. Check the form and try again.
      </p>
    )
  }
  return null
}
