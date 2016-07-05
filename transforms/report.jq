. as $in |
.[].sites |
map({ domain: .domain, url: .url }) |
unique |
map(
    .domain as $d |
    .profiles |=  (
        $in |
        map({
            key: .profile,
            value: {
                requests: .sites | map(select(.domain == $d))[0].requests
            }
        }) |
        from_entries
    )
)
