# Visual QA record

All builds, browser runs, comparisons and screenshot encoding ran on standard GitHub-hosted Ubuntu runners. The phone workspace was only used for writing lightweight source, GitHub API requests and viewing the returned screenshots.

## Verified failures and corrections

1. Poly Haven's material channel keys are `Diffuse`, `nor_gl`, `Rough` for these assets, not three lowercase names. Corrected the downloader and required at least three photographic material sets in capture validation. Six sets loaded successfully.
2. Three.js r180's SSAOPass composites AO into its input; it does not generate the beauty/color input. A preceding RenderPass is required. Restored it after reading the pinned r180 implementation.
3. OrbitControls camera limits were applied after `update()`. A previous interior view's maximum distance clamped the exterior cutaway into the roof. Moved limit changes before update, and added an exact camera-pose check.
4. A bedchamber camera was too close to the end of the clothes rack. Repositioned it and included the rack, screen and qin table in circulation collision boxes.
5. Actual captured images showed large rectangular, exactly black areas even though there were no browser errors. The CI tests therefore gained framebuffer probes; a green build alone is not considered sufficient visual validation.

## Controlled black-region investigation

A reproducible 1200×750 study view was run on the `visual-draft` branch. The four pixel-probe means below are RGB-byte averages; they are diagnostic samples, not aesthetic scores.

- Baseline: approximately 30, with three of four samples completely black.
- SSAO disabled: black regions remain.
- Fog sprites excluded from SSAO: black regions remain.
- Fog sprites hidden entirely: black regions remain.
- Water and paving reflectors hidden: black regions remain.
- Direct WebGL rendering without postprocessing: approximately 161, no black samples.
- Bloom disabled, remaining postprocessing retained: approximately 126, no black samples.
- Custom grade disabled: black regions remain.
- Output conversion disabled: black regions remain.
- Beauty pass plus output conversion only: approximately 161, no black samples.

This isolates the failure to the optional multi-mip bloom stage in this renderer/pipeline combination. That stage was removed rather than covering the black areas or editing the pictures afterward. Traditional lamps still have real emissive surfaces and local lights, and the pipeline retains SSAO, subtle grading and ACES. No general claim is made that all Three.js bloom configurations or GPU drivers have this problem.

## Final-pass changes

Reduced excessive daylight distance fog, preserved low vapor and rain effects, changed the paving to dark slate rather than reddish irregular slate, used a cropped photographic wood-grain set on timber and furniture, and varied willow leaf placement. Added a static mobile image gallery and a JPEG-only download archive.

The release's `render-report.json` contains the actual final commit, screenshot sizes/poses, framebuffer probes, PBR loading, route tests, first-person movement and continuous day/night button test. Visual fidelity remains a matter for image inspection; these automated checks do not certify a cinematic or archaeological standard.
