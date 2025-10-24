import { Router } from "express";
import { FamilyController } from "../controllers/familyController.js";

const router = Router();
const familyController = new FamilyController();

// Family routes
router.post("/", familyController.createFamily.bind(familyController));
router.get("/", familyController.getFamilies.bind(familyController));
router.get("/:id", familyController.getFamilyById.bind(familyController));

// Member routes
router.post(
  "/:familyId/members",
  familyController.addMember.bind(familyController)
);
router.delete(
  "/members/:memberId",
  familyController.removeMember.bind(familyController)
);
router.get(
  "/members/:walletAddress",
  familyController.getMemberInfo.bind(familyController)
);

export default router;
