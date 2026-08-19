# Public market-share security notes

## Access model

- Private editing layout: `markets/default`, signed-in readers and admin-only writes.
- Private booking data: `bookings/*`, always requires sign-in.
- Public layout snapshot: `publicMarketShares/<random UUID>`, produced only by an
  admin action and containing `{ market, stalls, isPublic: true }`.

The public snapshot deliberately omits bookings, renter names, contacts, and
all admin/account data. Public consumers perform a direct `get` by the
unguessable UUID embedded in the QR/link; Firestore rules do not allow listing
the collection. An admin can revoke a link by deleting its snapshot in the
Firebase Console until an in-app revoke control is added.

## Required deployment

The `publicMarketShares` rule in `firestore.rules` must be deployed before a
public QR link can work. The client code cannot publish a link until the same
rules have granted the signed-in admin write access.
