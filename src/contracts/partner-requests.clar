;; partner-requests.clar
;; Opens and closes partner requests for a registered project.

(define-map requests
  { project-id: (string-ascii 36) }
  { owner: principal, role: (string-ascii 64), is-open: bool, created-at: uint }
)

(define-read-only (get-request (project-id (string-ascii 36)))
  (map-get? requests { project-id: project-id })
)

(define-public (open-request (project-id (string-ascii 36)) (role (string-ascii 64)))
  (begin
    (map-set requests
      { project-id: project-id }
      { owner: tx-sender, role: role, is-open: true, created-at: block-height }
    )
    (ok true)
  )
)

(define-public (close-request (project-id (string-ascii 36)))
  (let ((req (unwrap! (map-get? requests { project-id: project-id }) (err u200))))
    (asserts! (is-eq tx-sender (get owner req)) (err u201))
    (map-set requests { project-id: project-id } (merge req { is-open: false }))
    (ok true)
  )
)
