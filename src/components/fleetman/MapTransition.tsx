"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type MapTransitionProps = {
  active: boolean;
  onComplete: () => void;
};

export function MapTransition({ active, onComplete }: MapTransitionProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-fleet-dark"
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.65, 0, 0.35, 1],
            }}
            style={{ transformOrigin: "45% 47%" }}
            className="relative h-[70vh] w-[70vh] max-w-[90vw]"
          >
            <Image
              src="/assets/africa-clean.jpg"
              alt="Carte d'Afrique"
              fill
              className="object-contain"
              priority
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
