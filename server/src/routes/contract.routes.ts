import { Router } from 'express';
import ContractController from '../controllers/contract.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/templates', authMiddleware, ContractController.getTemplates as any);
router.post('/templates', authMiddleware, ContractController.createTemplate as any);
router.get('/templates/default', authMiddleware, ContractController.getDefaultTemplate as any);
router.get('/templates/:id', authMiddleware, ContractController.getTemplateById as any);
router.put('/templates/:id', authMiddleware, ContractController.updateTemplate as any);
router.delete('/templates/:id', authMiddleware, ContractController.deleteTemplate as any);

router.get('/', authMiddleware, ContractController.getContracts as any);
router.post('/', authMiddleware, ContractController.createContract as any);
router.get('/:id', authMiddleware, ContractController.getContractById as any);
router.put('/:id', authMiddleware, ContractController.updateContract as any);
router.post('/:id/submit', authMiddleware, ContractController.submitForSignature as any);
router.post('/:id/sign', authMiddleware, ContractController.signContract as any);
router.post('/:id/terminate', authMiddleware, ContractController.terminateContract as any);

export default router;
