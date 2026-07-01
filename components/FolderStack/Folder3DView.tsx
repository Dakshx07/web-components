"use client";

import React, { forwardRef } from "react";
import { ReceiptCard } from "./ReceiptCard";
import styles from "./FolderStackAnimation.module.css";

interface Folder3DViewProps {
  className?: string;
}

export const Folder3DView = forwardRef<HTMLDivElement, Folder3DViewProps>(
  ({ className }, ref) => {
    return (
      <div className={`${styles.folder3dContainer} ${className || ""}`} ref={ref}>
        <div className={styles.folder3dGroup} data-folder3d-group>
          {/* Back cover (red) */}
          <div className={styles.folderBackCover} />

          {/* Document page (white/cream) */}
          <div className={styles.documentPage} data-doc-page>
            <div className={styles.docHashId}>
              4F:7A:2B:E1:9C:D3:88:A0:5F:6E:B4:C2:1D:73:E8:90
            </div>
            <div className={styles.docFileChip}>File #02</div>
            <div className={styles.docTextPeek}>
              There are signs of use: annotations,
              <br />
              omissions, the pressure of someone
              <br />
              else&apos;s urgency. No conclusion is
              <br />
              evident, but the document resists...
            </div>
          </div>

          {/* Front cover (blue) */}
          <div className={styles.folderFrontCover}>
            <div className={styles.folderFrontTab}>Peripheral Entry</div>
          </div>

          {/* Receipt card */}
          <div className={styles.receiptInFolder} data-receipt-card>
            <ReceiptCard compact />
          </div>
        </div>
      </div>
    );
  }
);

Folder3DView.displayName = "Folder3DView";
