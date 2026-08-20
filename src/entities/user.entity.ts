import { Column, ColumnType, CreatedAtColumn, Entity, PrimaryGeneratedColumn } from "@decorators/orm/column.decorator";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn(ColumnType.UUID)
    public readonly id!: string;

    @Column({ type: ColumnType.VARCHAR, length: 255 })
    public name!: string;

    @Column({ type: ColumnType.VARCHAR, length: 255, unique: true })
    public email!: string;

    @CreatedAtColumn()
    public readonly createdAt!: Date;

    constructor(id: string, name: string, email: string, createdAt: Date = new Date()) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.createdAt = createdAt;
    }
}