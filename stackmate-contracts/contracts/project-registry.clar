;; project-registry.clar
;; Registers projects on-chain. Each project is identified by an off-chain UUID.

(define-map projects
  { id: (string-ascii 36) }
  { owner: principal, looking-for-partner: bool, created-at: uint }
)

(define-map owner-projects
  { owner: principal }
  { count: uint }
)

(define-read-only (get-project (id (string-ascii 36)))
  (map-get? projects { id: id })
)

(define-read-only (get-owner-count (owner principal))
  (default-to u0 (get count (map-get? owner-projects { owner: owner })))
)

(define-public (register-project (id (string-ascii 36)))
  (let ((existing (map-get? projects { id: id })))
    (asserts! (is-none existing) (err u100)) ;; already registered
    (map-set projects
      { id: id }
      { owner: tx-sender, looking-for-partner: false, created-at: stacks-block-height }
    )
    (map-set owner-projects
      { owner: tx-sender }
      { count: (+ (get-owner-count tx-sender) u1) }
    )
    (ok true)
  )
)

(define-public (set-looking-for-partner (id (string-ascii 36)) (status bool))
  (let ((project (unwrap! (map-get? projects { id: id }) (err u101))))
    (asserts! (is-eq tx-sender (get owner project)) (err u102)) ;; not owner
    (map-set projects { id: id } (merge project { looking-for-partner: status }))
    (ok true)
  )
)
