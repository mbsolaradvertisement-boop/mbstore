import { memo } from "react";
import { motion } from "framer-motion";
import "./Loader.css";

const LOGO_PATH = "/assets/logo/mb.png";
const LEGACY_LOGO_PATH = "/assests/mb.png";

function Loader({ label = "Loading MB Store...", fullscreen = true }) {
  return (
    <motion.div
      className={`mb-loader ${fullscreen ? "mb-loader--fullscreen" : "mb-loader--contained"}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      initial={{ opacity: 0, scale: 1.015 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-loader__orb mb-loader__orb--one" aria-hidden="true" />
      <div className="mb-loader__orb mb-loader__orb--two" aria-hidden="true" />
      <div className="mb-loader__content">
        <div className="mb-loader__mark" aria-hidden="true">
          <span className="mb-loader__glow" />
          <span className="mb-loader__ring mb-loader__ring--outer" />
          <span className="mb-loader__ring mb-loader__ring--middle" />
          <img
            className="mb-loader__logo"
            src={LOGO_PATH}
            onError={(event) => {
              if (!event.currentTarget.src.endsWith(LEGACY_LOGO_PATH)) {
                event.currentTarget.src = LEGACY_LOGO_PATH;
              }
            }}
            alt=""
            width="90"
            height="90"
            decoding="async"
          />
        </div>
        <p className="mb-loader__text">
          Loading MB Store<span className="mb-loader__dots" aria-hidden="true" />
        </p>
      </div>
    </motion.div>
  );
}

export default memo(Loader);
