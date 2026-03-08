import React, { useRef } from "react";
import "./HoverVideos.css";

const videos = [
  { id: 1, src: "/video/1.mp4"},
  { id: 2, src: "/video/2.mp4" },
  { id: 3, src: "/video/3.mp4" },
];

const HoverVideos = () => {
  const videoRefs = useRef([]);

  const playVideo = (video) => {
    if (!video) return;

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {}); // error ignore
    }
  };

  const handleMouseEnter = (index) => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;

      if (i === index) {
        playVideo(video);
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  };

  const handleMouseLeave = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    video.pause();
    video.currentTime = 0;
  };

  return (
    <section className="hover-video-section">
      <div className="video-row">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="video-card"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={() => handleMouseLeave(index)}
          >
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              muted
              playsInline
              preload="metadata"
            >
              <source src={video.src} type="video/mp4" />
            </video>

            <div className="video-title">{video.title}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HoverVideos;
