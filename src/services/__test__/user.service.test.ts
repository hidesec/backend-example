/// <reference types="jest" />
import "reflect-metadata";
import { container } from "tsyringe";
import { IUserRepository } from "@repositories/user.repository.interface";
import { IEventBus } from "@events/event-bus";
import { UserService } from "@services/user.service";

describe("UserService", () => {
    let mockRepo: jest.Mocked<IUserRepository>;
    let mockEventBus: jest.Mocked<IEventBus>;
    let userService: UserService;

    const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
    };

    beforeEach(() => {
        mockRepo = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findRecentByEmails: jest.fn(),
            findAll: jest.fn(),
            findAllById: jest.fn(),
            findPage: jest.fn(),
            existsById: jest.fn(),
            count: jest.fn(),
            save: jest.fn(),
            deleteById: jest.fn(),
            delete: jest.fn(),
        };
        mockEventBus = {
            publish: jest.fn().mockResolvedValue(undefined),
        };

        container.register("DatabasePool", {
            useValue: {
                connect: jest.fn().mockResolvedValue(mockClient),
            },
        });

        userService = new UserService(mockRepo, mockEventBus);
    });

    it("should create a new user", async () => {
        const dto = { name: "John Doe", email: "john.doe@example.com" };
        const user = { id: "1", name: "John Doe", email: "john.doe@example.com", role: "USER", createdAt: new Date() };
        mockRepo.save.mockResolvedValueOnce(user);

        const result = await userService.createUser(dto);
        expect(result.name).toBe(dto.name);
        expect(result.email).toBe(dto.email);
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
        expect(mockEventBus.publish).toHaveBeenCalledWith("USER_CREATED", {
            userId: "1",
            email: "john.doe@example.com",
        });
        expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
        expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    });

    it("should throw NotFound when deleting missing user", async () => {
        mockRepo.findById.mockResolvedValueOnce(null);

        await expect(userService.deleteUser("missing-id")).rejects.toThrow("User with id missing-id not found");
        expect(mockRepo.deleteById).not.toHaveBeenCalled();
        expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });
});
