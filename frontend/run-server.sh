#!/bin/bash

# Try Python
if command -v python3 &>/dev/null; then
    echo "Starting server with Python 3..."
    python3 -m http.server 3000
    exit 0
fi

# Try node js serve
if command -v npx &>/dev/null; then
    echo "Starting server with npx serve..."
    npx serve -l 3000 .
    exit 0
fi

# Try Python 2
if command -v python &>/dev/null; then
    PYTHON_VERSION=$(python -c 'import sys; print(sys.version_info[0])' 2>/dev/null)
    if [ "$PYTHON_VERSION" = "2" ]; then
        echo "Starting server with Python 2..."
        python -m SimpleHTTPServer 3000
        exit 0
    fi
fi

echo "No suitable HTTP server found."
echo "Please install Python 3, Node.js (with npx), or use another HTTP server."
echo "Alternatively, you can open the HTML files directly in your browser."
exit 1
