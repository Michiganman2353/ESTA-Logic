# OpenCV.js Setup

This directory should contain the OpenCV.js WASM build for document edge detection and perspective correction.

## Download OpenCV.js

You have two options:

### Option 1: Download from OpenCV (Recommended for Production)

```bash
# Download the official OpenCV.js build
curl -L https://docs.opencv.org/4.x/opencv.js -o apps/frontend/public/opencv.js

# Or using wget
wget https://docs.opencv.org/4.x/opencv.js -O apps/frontend/public/opencv.js
```

### Option 2: Use CDN (Recommended for Development)

Update your `apps/frontend/index.html` to load from CDN:

```html
<script async src="https://docs.opencv.org/4.x/opencv.js"></script>
```

**Note:** When using CDN, update your Content Security Policy:

```javascript
"Content-Security-Policy": "script-src 'self' https://docs.opencv.org; worker-src 'self' blob:;"
```

## File Size

The OpenCV.js file is approximately **8-10 MB**. Consider the following optimizations:

1. **Lazy Loading**: Only load OpenCV.js when the DocumentScanner component is used
2. **Custom Build**: Build a minimal OpenCV.js with only required modules
3. **CDN with Caching**: Use a CDN with proper cache headers

## Verification

After downloading, verify the file:

```bash
# Check file exists
ls -lh apps/frontend/public/opencv.js

# Check file size (should be ~8-10 MB)
du -h apps/frontend/public/opencv.js
```

## Custom Build (Advanced)

For a smaller bundle, you can build OpenCV.js with only required modules:

```bash
# Clone OpenCV repository
git clone https://github.com/opencv/opencv.git
cd opencv

# Build with minimal modules
python ./platforms/js/build_js.py build_wasm \
  --build_wasm \
  --cmake_option="-DBUILD_LIST=core,imgproc,imgcodecs" \
  --emscripten_dir=/path/to/emsdk/upstream/emscripten

# Copy the built file
cp build_wasm/bin/opencv.js /path/to/ESTA-Logic/apps/frontend/public/
```

## Troubleshooting

### OpenCV not loading

- Ensure the file path is correct
- Check browser console for errors
- Verify Content Security Policy allows the script
- Try loading from CDN to isolate local issues

### WASM not supported

- OpenCV.js requires WebAssembly support
- Check browser compatibility: Chrome 57+, Firefox 52+, Safari 11+, Edge 16+

### Out of memory errors

- OpenCV.js requires significant memory for image processing
- Consider reducing image resolution before processing
- Implement proper cleanup of Mat objects

## License

OpenCV.js is released under the Apache 2.0 License.
See https://github.com/opencv/opencv/blob/master/LICENSE for details.
