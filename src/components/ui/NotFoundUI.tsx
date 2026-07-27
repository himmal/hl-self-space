import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { RadioTower, ScanLine } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export const NotFoundUI = () => {
  return (
    <div className="ui-layer items-center justify-center text-center">
      <motion.div
        className="glass-card hud-corner-bracket relative flex max-w-xl flex-col items-center gap-6 px-10 py-14"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="flex items-center gap-2 text-sm tracking-[0.3em] text-[var(--color-sci-magenta)] uppercase"
        >
          <RadioTower className="h-4 w-4" aria-hidden="true" />
          <span>Signal Lost</span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          data-glitch-trigger="true"
          className="text-glitch text-6xl text-[var(--color-sci-cyan)] sm:text-7xl"
        >
          404
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg font-semibold tracking-wide text-[var(--color-sci-cyan)] uppercase"
        >
          Neural Grid Disconnection
        </motion.p>

        <motion.p
          variants={itemVariants}
          className="max-w-md text-sm text-[var(--color-sci-amber)]"
        >
          The node you tried to reach does not exist in this sector of the grid. The requested
          coordinates returned no signal.
        </motion.p>

        <motion.div variants={itemVariants} className="flex items-center gap-2 text-xs opacity-70">
          <ScanLine className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
          <span>Scanning for nearby nodes&hellip;</span>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link
            to="/"
            className="inline-block rounded-md border border-[var(--color-sci-cyan)] px-6 py-3 text-sm font-bold tracking-[0.2em] text-[var(--color-sci-cyan)] uppercase shadow-[0_0_20px_rgba(0,255,204,0.25)] transition-all duration-300 hover:bg-[var(--color-sci-cyan)] hover:text-[var(--color-sci-bg)] hover:shadow-[0_0_30px_rgba(0,255,204,0.6)]"
          >
            Re-establish Link
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundUI;
