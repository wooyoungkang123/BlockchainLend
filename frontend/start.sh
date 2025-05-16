#!/bin/bash
# This script runs the frontend without TypeScript errors

export VITE_SKIP_TS_CHECK=true
export VITE_DEVELOPMENT_MODE=true

# Use the direct path to vite
node node_modules/vite/bin/vite.js --force 