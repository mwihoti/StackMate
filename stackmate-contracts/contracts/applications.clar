;; applications.clar
;; Records builder applications to partner requests on-chain.

(define-map applications
  { project-id: (string-ascii 36), applicant: principal }
  { status: (string-ascii 10), applied-at: uint }
)

(define-read-only (get-application (project-id (string-ascii 36)) (applicant principal))
  (map-get? applications { project-id: project-id, applicant: applicant })
)

(define-public (apply (project-id (string-ascii 36)))
  (let ((existing (map-get? applications { project-id: project-id, applicant: tx-sender })))
    (asserts! (is-none existing) (err u300)) ;; already applied
    (map-set applications
      { project-id: project-id, applicant: tx-sender }
      { status: "pending", applied-at: stacks-block-height }
    )
    (ok true)
  )
)

(define-public (update-status
  (project-id (string-ascii 36))
  (applicant principal)
  (new-status (string-ascii 10))
)
  (let ((app (unwrap! (map-get? applications { project-id: project-id, applicant: applicant }) (err u301))))
    (map-set applications
      { project-id: project-id, applicant: applicant }
      (merge app { status: new-status })
    )
    (ok true)
  )
)
