module.exports = {
    build: {
        bundle_total_kb: 350, // Relaxed slightly for initial run
        largest_chunk_kb: 150,
        css_total_kb: 100,
        assets_count: 80
    },
    render: {
        fp_ms: 1500,
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
