module.exports = {
    build: {
        bundle_total_kb: 1500, // Updated baseline for current bundle
        largest_chunk_kb: 470,
        css_total_kb: 320,
        assets_count: 120
    },
    render: {
        fp_ms: 3000,
        inp_ms: 200,
        cls: 0.1, // Relaxed slightly
        long_task_ms: 50,
        long_tasks_total_ms: 500
    },
    network: {
        api_timeout_ms: 3000
    },
    ux: {
        min_target_size: 44
    },
    a11y: {
        max_critical_violations: 0
    }
}
