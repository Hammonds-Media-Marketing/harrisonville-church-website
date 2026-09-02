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
  if (params.error === 'slug') {
    return (
      <p role="alert" className="mb-5 font-semibold text-error">
        That web address is not usable. Choose a short lowercase path that does not start with an existing
        section of the site, and make sure no other page already uses it.
      </p>
    )
  }
  if (params.error === 'meta') {
    return (
      <p role="alert" className="mb-5 font-semibold text-error">
        The search description needs to be between 50 and 160 characters.
      </p>
    )
  }
  if (params.error === 'og') {
    return (
      <p role="alert" className="mb-5 font-semibold text-error">
        The share title and share description are required, and each must differ from the search title and
        search description.
      </p>
    )
  }
  if (params.error === 'sections') {
    return (
      <p role="alert" className="mb-5 font-semibold text-error">
        A published page needs at least one completed section. Add one, or save with Published unchecked.
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
