;; partnerships.clar
;; Records accepted partnerships and mutual endorsements on-chain.

(define-map partnerships
  { project-id: (string-ascii 36) }
  {
    owner: principal,
    partner: principal,
    formed-at: uint,
    owner-endorsed: bool,
    partner-endorsed: bool,
  }
)

(define-read-only (get-partnership (project-id (string-ascii 36)))
  (map-get? partnerships { project-id: project-id })
)

(define-public (accept-partner (project-id (string-ascii 36)) (partner principal))
  (begin
    (map-set partnerships
      { project-id: project-id }
      {
        owner: tx-sender,
        partner: partner,
        formed-at: block-height,
        owner-endorsed: false,
        partner-endorsed: false,
      }
    )
    (ok true)
  )
)

(define-public (endorse (project-id (string-ascii 36)))
  (let ((p (unwrap! (map-get? partnerships { project-id: project-id }) (err u400))))
    (if (is-eq tx-sender (get owner p))
      (begin
        (map-set partnerships { project-id: project-id } (merge p { owner-endorsed: true }))
        (ok true)
      )
      (if (is-eq tx-sender (get partner p))
        (begin
          (map-set partnerships { project-id: project-id } (merge p { partner-endorsed: true }))
          (ok true)
        )
        (err u401) ;; not a party to this partnership
      )
    )
  )
)
