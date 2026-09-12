#!/bin/bash
echo "Starting CloudScale Platform Locally..."

# Start Backend
(cd backend && npm run dev) &
BACKEND_PID=$!

# Start Frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Frontend running at http://localhost:3000"
echo "Backend running at http://localhost:5000"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
